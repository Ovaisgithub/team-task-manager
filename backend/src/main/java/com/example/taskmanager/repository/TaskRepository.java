package com.example.taskmanager.repository;

import com.example.taskmanager.model.Project;
import com.example.taskmanager.model.Task;
import com.example.taskmanager.model.TaskStatus;
import com.example.taskmanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProject(Project project);

    long countByStatus(TaskStatus status);

    List<Task> findByDueDateBeforeAndStatusNot(LocalDate date, TaskStatus status);

    // Overdue tasks visible to a specific user (assignee or project owner or member)
    @Query("""
        SELECT t FROM Task t
        WHERE t.dueDate < :today
          AND t.status <> 'DONE'
          AND (t.assignee = :user
               OR t.project.owner = :user
               OR :user MEMBER OF t.project.members)
        """)
    List<Task> findOverdueForUser(@Param("today") LocalDate today, @Param("user") User user);

    // Count by status across all projects a user can see
    @Query("""
        SELECT COUNT(t) FROM Task t
        WHERE t.status = :status
          AND (t.project.owner = :user OR :user MEMBER OF t.project.members)
        """)
    long countByStatusForUser(@Param("status") TaskStatus status, @Param("user") User user);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.project.owner = :user OR :user MEMBER OF t.project.members")
    long countAllForUser(@Param("user") User user);
}
