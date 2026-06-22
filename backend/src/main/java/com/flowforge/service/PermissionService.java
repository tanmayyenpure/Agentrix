package com.flowforge.service;

import com.flowforge.exception.AccessDeniedAppException;
import com.flowforge.model.User;
import com.flowforge.model.enums.RoleName;
import org.springframework.stereotype.Service;

@Service
public class PermissionService {
    public void require(User user, String permission) {
        boolean admin = hasRole(user, RoleName.ROLE_ADMIN);
        boolean editor = hasRole(user, RoleName.ROLE_EDITOR);
        boolean allowed = switch (permission) {
            case "team:manage", "apikey:manage", "billing:manage" -> admin;
            case "workflow:write", "platform:write", "agent:manage", "connector:install" -> admin || editor;
            default -> admin || editor || hasRole(user, RoleName.ROLE_VIEWER);
        };
        if (!allowed) throw new AccessDeniedAppException("Permission required: " + permission);
    }

    private boolean hasRole(User user, RoleName roleName) {
        return user.getRoles().stream().anyMatch(role -> role.getName() == roleName);
    }
}
