package com.flowforge.repository;

import com.flowforge.model.IntegrationConnector;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IntegrationConnectorRepository extends JpaRepository<IntegrationConnector, Long> {
    List<IntegrationConnector> findAllByOrderByCategoryAscNameAsc();
    Optional<IntegrationConnector> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
