package com.example.taskmanager.controller;

import com.example.taskmanager.dto.DashboardStats;
import com.example.taskmanager.model.Task;
import com.example.taskmanager.model.User;
import com.example.taskmanager.service.AuthService;
import com.example.taskmanager.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskService taskService;
    private final AuthService authService;

    public TaskController(TaskService taskService, AuthService authService) {
        this.taskService = taskService;
        this.authService = authService;
    }

    @GetMapping("/dashboard/stats")
    public DashboardStats getStats(@RequestHeader("Authorization") String auth) {
        return taskService.getDashboardStats(authService.authenticate(auth));
    }

    @GetMapping("/tasks/overdue")
    public List<Task> getOverdue(@RequestHeader("Authorization") String auth) {
        return taskService.getOverdueTasks(authService.authenticate(auth));
    }

    @GetMapping("/projects/{projectId}/tasks")
    public List<Task> getTasks(@RequestHeader("Authorization") String auth,
                               @PathVariable Long projectId) {
        return taskService.getTasksForProject(authService.authenticate(auth), projectId);
    }

    @PostMapping("/projects/{projectId}/tasks")
    public Task createTask(@RequestHeader("Authorization") String auth,
                           @PathVariable Long projectId,
                           @Valid @RequestBody Task task) {
        return taskService.createTask(authService.authenticate(auth), projectId, task);
    }

    @PatchMapping("/tasks/{taskId}")
    public Task updateTask(@RequestHeader("Authorization") String auth,
                           @PathVariable Long taskId,
                           @RequestBody Task updates) {
        return taskService.updateTask(authService.authenticate(auth), taskId, updates);
    }

    @DeleteMapping("/tasks/{taskId}")
    public Map<String, String> deleteTask(@RequestHeader("Authorization") String auth,
                                          @PathVariable Long taskId) {
        taskService.deleteTask(authService.authenticate(auth), taskId);
        return Map.of("message", "Task deleted");
    }
}
