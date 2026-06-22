package com.flowforge.service;

import com.flowforge.model.AppNotification;
import com.flowforge.model.AuditLog;
import com.flowforge.model.Execution;
import com.flowforge.model.ScheduleEntry;
import com.flowforge.model.enums.NotificationType;
import com.flowforge.model.enums.ResourceType;
import com.flowforge.repository.AppNotificationRepository;
import com.flowforge.repository.AuditLogRepository;
import com.flowforge.repository.ScheduleEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleRunnerService {
    private final ScheduleEntryRepository scheduleRepository;
    private final ExecutionEngineService executionEngineService;
    private final CronService cronService;
    private final AppNotificationRepository notificationRepository;
    private final AuditLogRepository auditRepository;

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void runDueSchedules() {
        Instant now = Instant.now();
        List<ScheduleEntry> due = scheduleRepository.findByEnabledTrueAndNextRunAtLessThanEqual(now);
        for (ScheduleEntry schedule : due) {
            try {
                Execution execution = executionEngineService.run(schedule.getWorkflow(), schedule.getWorkflow().getOwner(), "{\"trigger\":\"schedule\"}");
                schedule.setLastRunAt(now);
                schedule.setLastStatus(execution.getStatus());
                schedule.setNextRunAt(cronService.nextRun(schedule.getCronExpression(), now));
                scheduleRepository.save(schedule);
                notificationRepository.save(AppNotification.builder()
                        .organization(schedule.getOrganization())
                        .title(execution.getStatus().name().equals("SUCCESS") ? "Scheduled run completed" : "Scheduled run failed")
                        .message(schedule.getWorkflow().getName() + " ran from schedule " + schedule.getCronExpression())
                        .type(execution.getStatus().name().equals("SUCCESS") ? NotificationType.SUCCESS : NotificationType.FAILURE)
                        .workflowId(schedule.getWorkflow().getId())
                        .executionId(execution.getId())
                        .build());
                auditRepository.save(AuditLog.builder()
                        .organization(schedule.getOrganization())
                        .user(schedule.getWorkflow().getOwner())
                        .action("SCHEDULE_TRIGGERED")
                        .resourceType(ResourceType.WORKFLOW)
                        .resourceId(schedule.getWorkflow().getId())
                        .resourceName(schedule.getWorkflow().getName())
                        .metadata("{\"scheduleId\":" + schedule.getId() + ",\"executionId\":" + execution.getId() + "}")
                        .build());
            } catch (RuntimeException ex) {
                log.warn("Schedule {} failed: {}", schedule.getId(), ex.getMessage());
                schedule.setLastRunAt(now);
                schedule.setNextRunAt(now.plusSeconds(300));
                scheduleRepository.save(schedule);
            }
        }
    }
}
