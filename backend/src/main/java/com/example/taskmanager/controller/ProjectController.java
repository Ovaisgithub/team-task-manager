package com.example.taskmanager.controller;

import com.example.taskmanager.model.Project;
import com.example.taskmanager.model.User;
import com.example.taskmanager.service.AuthService;
import com.example.taskmanager.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    private final ProjectService projectService;
    private final AuthService authService;

    public ProjectController(ProjectService projectService, AuthService authService) {
        this.projectService = projectService;
        this.authService = authService;
    }

    @GetMapping
    public List<Project> getProjects(@RequestHeader("Authorization") String auth) {
        return projectService.getProjectsForUser(authService.authenticate(auth));
    }

    @PostMapping
    public Project createProject(@RequestHeader("Authorization") String auth,
                                 @Valid @RequestBody Project project) {
        return projectService.createProject(authService.authenticate(auth), project);
    }

    @GetMapping("/{id}")
    public Project getProject(@RequestHeader("Authorization") String auth,
                               @PathVariable Long id) {
        return projectService.getProjectById(authService.authenticate(auth), id);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteProject(@RequestHeader("Authorization") String auth,
                                              @PathVariable Long id) {
        projectService.deleteProject(authService.authenticate(auth), id);
        return Map.of("message", "Project deleted");
    }

    // ----- Member management -----

    @PostMapping("/{id}/members/{userId}")
    public Project addMember(@RequestHeader("Authorization") String auth,
                              @PathVariable Long id,
                              @PathVariable Long userId) {
        return projectService.addMember(authService.authenticate(auth), id, userId);
    }

    @DeleteMapping("/{id}/members/{userId}")
    public Project removeMember(@RequestHeader("Authorization") String auth,
                                 @PathVariable Long id,
                                 @PathVariable Long userId) {
        return projectService.removeMember(authService.authenticate(auth), id, userId);
    }
}
