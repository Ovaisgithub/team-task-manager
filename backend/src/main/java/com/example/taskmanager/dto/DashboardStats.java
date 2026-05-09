package com.example.taskmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class DashboardStats {
    private long totalProjects;
    private long totalTasks;
    private long tasksTodo;
    private long tasksInProgress;
    private long tasksDone;
    private long overdueCount;
}
