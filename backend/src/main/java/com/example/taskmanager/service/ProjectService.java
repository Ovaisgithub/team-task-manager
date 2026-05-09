package com.example.taskmanager.service;

import com.example.taskmanager.exception.ForbiddenException;
import com.example.taskmanager.exception.NotFoundException;
import com.example.taskmanager.model.Project;
import com.example.taskmanager.model.Role;
import com.example.taskmanager.model.User;
import com.example.taskmanager.repository.ProjectRepository;
import com.example.taskmanager.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    public List<Project> getProjectsForUser(User user) {
        if (user.getRole() == Role.ADMIN) {
            return projectRepository.findAll();
        }
        return projectRepository.findAllAccessibleByUser(user);
    }

    @Transactional
    public Project createProject(User owner, Project project) {
        project.setOwner(owner);
        return projectRepository.save(project);
    }

    public Project getProjectById(User user, Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Project not found"));
        assertAccess(user, project);
        return project;
    }

    @Transactional
    public void deleteProject(User user, Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Project not found"));
        assertOwnerOrAdmin(user, project);
        projectRepository.delete(project);
    }

    @Transactional
    public Project addMember(User requester, Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found"));
        assertOwnerOrAdmin(requester, project);
        User newMember = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (newMember.getId().equals(project.getOwner().getId())) {
            throw new ForbiddenException("Owner is already a member of the project");
        }
        project.getMembers().add(newMember);
        return projectRepository.save(project);
    }

    @Transactional
    public Project removeMember(User requester, Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found"));
        assertOwnerOrAdmin(requester, project);
        User member = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        project.getMembers().remove(member);
        return projectRepository.save(project);
    }

    // ----- helpers -----

    private void assertAccess(User user, Project project) {
        if (user.getRole() == Role.ADMIN) return;
        if (project.getOwner().getId().equals(user.getId())) return;
        if (project.getMembers().stream().anyMatch(m -> m.getId().equals(user.getId()))) return;
        throw new ForbiddenException("You do not have access to this project");
    }

    private void assertOwnerOrAdmin(User user, Project project) {
        if (user.getRole() == Role.ADMIN) return;
        if (project.getOwner().getId().equals(user.getId())) return;
        throw new ForbiddenException("Only the project owner or an admin can perform this action");
    }
}
