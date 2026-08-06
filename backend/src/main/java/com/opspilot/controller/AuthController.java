package com.opspilot.controller;

import com.opspilot.dto.AuthRequest;
import com.opspilot.dto.AuthResponse;
import com.opspilot.dto.RegisterRequest;
import com.opspilot.entity.RefreshToken;
import com.opspilot.exception.UnauthorizedException;
import com.opspilot.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long jwtRefreshExpirationMs;

    private ResponseCookie createRefreshTokenCookie(String refreshTokenValue) {
        return ResponseCookie.from("opspilot_refresh_token", refreshTokenValue)
                .httpOnly(true)
                .secure(false) // Set to true in production over HTTPS
                .path("/api/auth")
                .maxAge(jwtRefreshExpirationMs / 1000)
                .sameSite("Lax")
                .build();
    }

    private ResponseCookie createCleanRefreshTokenCookie() {
        return ResponseCookie.from("opspilot_refresh_token", "")
                .httpOnly(true)
                .path("/api/auth")
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.register(request);
        RefreshToken refreshToken = authService.createRefreshToken(authResponse.getId());
        ResponseCookie cookie = createRefreshTokenCookie(refreshToken.getToken());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return new ResponseEntity<>(authResponse, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        RefreshToken refreshToken = authService.createRefreshToken(authResponse.getId());
        ResponseCookie cookie = createRefreshTokenCookie(refreshToken.getToken());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenStr = null;
        if (request.getCookies() != null) {
            refreshTokenStr = Arrays.stream(request.getCookies())
                    .filter(c -> "opspilot_refresh_token".equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }

        if (refreshTokenStr == null || refreshTokenStr.isBlank()) {
            throw new UnauthorizedException("Refresh Token cookie is missing");
        }

        AuthResponse authResponse = authService.refreshAccessToken(refreshTokenStr);
        RefreshToken newRefreshToken = authService.createRefreshToken(authResponse.getId());
        ResponseCookie cookie = createRefreshTokenCookie(newRefreshToken.getToken());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        if (request.getCookies() != null) {
            Arrays.stream(request.getCookies())
                    .filter(c -> "opspilot_refresh_token".equals(c.getName()))
                    .map(Cookie::getValue)
                    .forEach(authService::deleteRefreshToken);
        }

        ResponseCookie cleanCookie = createCleanRefreshTokenCookie();
        response.addHeader(HttpHeaders.SET_COOKIE, cleanCookie.toString());
        return ResponseEntity.noContent().build();
    }
}
