package com.flowforge.repository;

import com.flowforge.model.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {
    List<AppNotification> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
}
