package com.flowforge.service;

import com.flowforge.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CronService {
    public Instant nextRun(String expression, Instant after) {
        String[] parts = expression == null ? new String[0] : expression.trim().split("\\s+");
        if (parts.length != 5) throw new BadRequestException("Cron expression must have 5 parts");
        ZonedDateTime cursor = after.atZone(ZoneOffset.UTC).plusMinutes(1).withSecond(0).withNano(0);
        for (int i = 0; i < 366 * 24 * 60; i++) {
            if (matches(parts[0], cursor.getMinute(), 0, 59)
                    && matches(parts[1], cursor.getHour(), 0, 23)
                    && matches(parts[2], cursor.getDayOfMonth(), 1, 31)
                    && matches(parts[3], cursor.getMonthValue(), 1, 12)
                    && matches(parts[4], cursor.getDayOfWeek().getValue() % 7, 0, 6)) {
                return cursor.toInstant();
            }
            cursor = cursor.plusMinutes(1);
        }
        throw new BadRequestException("Cron expression does not produce a run within one year");
    }

    private boolean matches(String field, int value, int min, int max) {
        if ("*".equals(field)) return true;
        for (String part : field.split(",")) {
            if (part.startsWith("*/")) {
                int step = Integer.parseInt(part.substring(2));
                if (step > 0 && value % step == 0) return true;
            } else if (part.contains("-")) {
                String[] bounds = part.split("-");
                int start = Integer.parseInt(bounds[0]);
                int end = Integer.parseInt(bounds[1]);
                if (value >= start && value <= end) return true;
            } else {
                int exact = Integer.parseInt(part);
                if (exact < min || exact > max) return false;
                if (value == exact) return true;
            }
        }
        return false;
    }

    public List<String> validate(String expression) {
        List<String> errors = new ArrayList<>();
        try {
            nextRun(expression, Instant.now());
        } catch (RuntimeException ex) {
            errors.add(ex.getMessage());
        }
        return errors;
    }
}
