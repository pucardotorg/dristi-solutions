package org.egov.user.security.oauth2;

import org.springframework.security.core.Authentication;

/**
 * Abstraction for token storage (access tokens + refresh tokens).
 * Replaces the deprecated Spring Security OAuth2 TokenStore.
 */
public interface EgovTokenStore {

    void storeAccessToken(String token, Authentication authentication, long expirySeconds);

    void storeRefreshToken(String refreshToken, Authentication authentication, long expirySeconds);

    /** 
     * Store mapping between access token and refresh token.
     * Used to invalidate old access token when refresh_token is used.
     */
    void storeAccessTokenToRefreshTokenMapping(String accessToken, String refreshToken);

    /** 
     * Remove access token associated with the given refresh token.
     * Mirrors old Spring OAuth2 behavior: tokenStore.removeAccessTokenUsingRefreshToken()
     */
    void removeAccessTokenUsingRefreshToken(String refreshToken);

    Authentication readAuthentication(String accessToken);

    Authentication readAuthenticationFromRefreshToken(String refreshToken);

    boolean removeAccessToken(String accessToken);

    void removeRefreshToken(String refreshToken);

    /** Remove all access tokens issued to a given username (used on account lock). */
    void removeAllTokensByUsername(String username);
}
