package com.flowforge.service;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class CronServiceTest {
    private final CronService cronService = new CronService();

    @Test
    void computesNextDailyRun() {
        Instant next = cronService.nextRun("0 9 * * *", Instant.parse("2026-06-22T08:55:00Z"));
        assertThat(next).isEqualTo(Instant.parse("2026-06-22T09:00:00Z"));
    }
}
