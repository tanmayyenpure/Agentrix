package com.flowforge.repository;

import com.flowforge.model.ScheduleEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface ScheduleEntryRepository extends JpaRepository<ScheduleEntry, Long> {
    List<ScheduleEntry> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
    List<ScheduleEntry> findByEnabledTrueAndNextRunAtLessThanEqual(Instant now);
}
