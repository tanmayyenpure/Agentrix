package com.flowforge.model;

import com.flowforge.model.enums.NodeType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "workflow_nodes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Stable identifier used inside the workflow graph (referenced by edges and by the
     * frontend canvas / React Flow). Distinct from the DB primary key so a node can keep
     * its position in a graph across edits.
     */
    @Column(nullable = false)
    private String clientId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workflow_id")
    private Workflow workflow;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NodeType type;

    @Column(nullable = false)
    private String label;

    /** JSON-encoded node-specific configuration, e.g. {"url": "...", "method": "POST"}. */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String config;

    @Builder.Default
    private double positionX = 0;

    @Builder.Default
    private double positionY = 0;
}
