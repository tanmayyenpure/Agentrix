package com.flowforge.service;

import com.flowforge.dto.AcceptInviteRequest;
import com.flowforge.dto.AuthResponse;
import com.flowforge.dto.LoginRequest;
import com.flowforge.dto.RegisterRequest;
import com.flowforge.exception.BadRequestException;
import com.flowforge.model.Organization;
import com.flowforge.model.Role;
import com.flowforge.model.User;
import com.flowforge.model.enums.RoleName;
import com.flowforge.repository.OrganizationRepository;
import com.flowforge.repository.RoleRepository;
import com.flowforge.repository.UserRepository;
import com.flowforge.security.CustomUserDetails;
import com.flowforge.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with this email already exists");
        }

        Organization org = Organization.builder()
                .name(request.getOrganizationName() != null && !request.getOrganizationName().isBlank()
                        ? request.getOrganizationName()
                        : request.getFullName() + "'s Organization")
                .build();
        org = organizationRepository.save(org);

        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not seeded"));

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .organization(org)
                .roles(Set.of(adminRole))
                .build();
        user = userRepository.save(user);

        String token = jwtService.generateToken(new CustomUserDetails(user));

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        String token = jwtService.generateToken(new CustomUserDetails(user));

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .build();
    }

    @Transactional
    public AuthResponse acceptInvite(AcceptInviteRequest request) {
        User user = userRepository.findByInviteToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired invite token"));
        user.setFullName(request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setInviteToken(null);
        user.setEnabled(true);
        user = userRepository.save(user);

        String token = jwtService.generateToken(new CustomUserDetails(user));
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .build();
    }
}
