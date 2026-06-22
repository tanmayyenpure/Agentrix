package com.flowforge.model.enums;

/**
 * Built-in node types supported by the execution engine.
 * Phase 2+ (AI Workflow Generator, AI Agents) will add more types here.
 */
public enum NodeType {
    TRIGGER_MANUAL,
    TRIGGER_WEBHOOK,
    TRIGGER_SCHEDULE,
    HTTP_REQUEST,
    LOG,
    DELAY,
    CONDITION,
    TRANSFORM
}
