package com.flowforge.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "workflow_edges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowEdge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workflow_id")
    private Workflow workflow;

    /** clientId of the source WorkflowNode. */
    @Column(nullable = false)
    private String sourceClientId;

    /** clientId of the target WorkflowNode. */
    @Column(nullable = false)
    private String targetClientId;

    /**
     * Optional branch label, used by CONDITION nodes (e.g. "true" / "false")
     * to decide which outgoing edge to follow.
     */
    private String conditionBranch;
}
