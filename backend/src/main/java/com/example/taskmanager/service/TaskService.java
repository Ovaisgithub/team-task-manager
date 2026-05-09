package com.example.taskmanager.service;

import com.example.taskmanager.dto.DashboardStats;
import com.example.taskmanager.exception.ForbiddenException;
import com.example.taskmanager.exception.NotFoundException;
import com.example.taskmanager.model.*;
import com.example.taskmanager.repository.ProjectRepository;
import com.example.taskmanager.repository.TaskRepository;
import com.example.taskmanager.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository,
                       ProjectRepository projectRepository,
                       UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    public List<Task> getTasksForProject(User user, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found"));
        assertProjectAccess(user, project);
        return taskRepository.findByProject(project);
    }

    @Transactional
    public Task createTask(User user, Long projectId, Task task) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found"));
        assertProjectAccess(user, project);
        task.setProject(project);
        if (task.getAssignee() != null && task.getAssignee().getId() != null) {
            User assignee = userRepository.findById(task.getAssignee().getId())
                    .orElseThrow(() -> new NotFoundException("Assignee not found"));
            task.setAssignee(assignee);
        }
        return taskRepository.save(task);
    }

    @Transactional
    public Task updateTask(User user, Long taskId, Task updates) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));
        assertProjectAccess(user, task.getProject());
        if (updates.getTitle() != null && !updates.getTitle().isBlank()) task.setTitle(updates.getTitle());
        if (updates.getDescription() != null) task.setDescription(updates.getDescription());
        if (updates.getStatus() != null) task.setStatus(updates.getStatus());
        if (updates.getDueDate() != null) task.setDueDate(updates.getDueDate());
        if (updates.getAssignee() != null && updates.getAssignee().getId() != null) {
            User assignee = userRepository.findById(updates.getAssignee().getId())
                    .orElseThrow(() -> new NotFoundException("Assignee not found"));
            task.setAssignee(assignee);
        }
        return taskRepository.save(task);
    }

    @Transactional
    public void deleteTask(User user, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));
        assertProjectAccess(user, task.getProject());
        taskRepository.delete(task);
    }

    public List<Task> getOverdueTasks(User user) {
        if (user.getRole() == Role.ADMIN) {
            return taskRepository.findByDueDateBeforeAndStatusNot(LocalDate.now(), TaskStatus.DONE);
        }
        return taskRepository.findOverdueForUser(LocalDate.now(), user);
    }

    public DashboardStats getDashboardStats(User user) {
        long totalProjects;
        long totalTasks;
        long todo;
        long inProgress;
        long done;
        long overdue;

        if (user.getRole() == Role.ADMIN) {
            totalProjects = projectRepository.count();
            totalTasks    = taskRepository.count();
            todo          = taskRepository.countByStatus(TaskStatus.TODO);
            inProgress    = taskRepository.countByStatus(TaskStatus.IN_PROGRESS);
            done          = taskRepository.countByStatus(TaskStatus.DONE);
            overdue       = taskRepository.findByDueDateBeforeAndStatusNot(LocalDate.now(), TaskStatus.DONE).size();
        } else {
            totalProjects = projectRepository.findAllAccessibleByUser(user).size();
            totalTasks    = taskRepository.countAllForUser(user);
            todo          = taskRepository.countByStatusForUser(TaskStatus.TODO, user);
            inProgress    = taskRepository.countByStatusForUser(TaskStatus.IN_PROGRESS, user);
            done          = taskRepository.countByStatusForUser(TaskStatus.DONE, user);
            overdue       = taskRepository.findOverdueForUser(LocalDate.now(), user).size();
        }
        return new DashboardStats(totalProjects, totalTasks, todo, inProgress, done, overdue);
    }

    // ----- helper -----
    private void assertProjectAccess(User user, Project project) {
        if (user.getRole() == Role.ADMIN) return;
        if (project.getOwner().getId().equals(user.getId())) return;
        if (project.getMembers().stream().anyMatch(m -> m.getId().equals(user.getId()))) return;
        throw new ForbiddenException("You do not have access to this project");
    }
}
