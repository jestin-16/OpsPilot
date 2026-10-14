package com.opspilot.connector;

import com.opspilot.connector.impl.AppLogsConnector;
import com.opspilot.connector.impl.CicdConnector;
import com.opspilot.connector.impl.DockerConnector;
import com.opspilot.connector.impl.GitConnector;
import com.opspilot.connector.impl.KubernetesConnector;
import com.opspilot.enums.ProviderType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/** Behaviour every {@link IntegrationConnector} must share, whatever the backend it talks to. */
public class ConnectorContractTest {

    static Stream<IntegrationConnector> connectors() {
        return Stream.of(new DockerConnector(), new KubernetesConnector(), new GitConnector(), new CicdConnector(), new AppLogsConnector());
    }

    private static ConnectorConfig empty(IntegrationConnector c) {
        return new ConnectorConfig(1L, 1L, c.type(), "x", Map.of(), Map.of("token", "do-not-leak"));
    }

    @ParameterizedTest
    @MethodSource("connectors")
    void declaresItsType(IntegrationConnector c) {
        assertNotNull(c.type());
    }

    @ParameterizedTest
    @MethodSource("connectors")
    void testConnectionNeverThrowsAndNeverEchoesSecrets(IntegrationConnector c) {
        ConnectionResult r = assertDoesNotThrow(() -> c.testConnection(empty(c)));
        assertNotNull(r.message());
        assertFalse(r.message().contains("do-not-leak"));
        if (!c.isPushBased()) {
            assertFalse(r.ok(), "an empty configuration must not connect");
        }
    }

    @ParameterizedTest
    @MethodSource("connectors")
    void streamReportsBadConfigAsAnErrorSignal(IntegrationConnector c) {
        if (c.isPushBased()) {
            assertNull(c.streamLogs(empty(c), LogFilters.none()).collectList().block(Duration.ofSeconds(2)).stream().findAny().orElse(null));
            return;
        }
        assertDoesNotThrow(() -> c.streamLogs(empty(c), LogFilters.none()));
        assertThrows(IllegalStateException.class, () -> c.streamLogs(empty(c), LogFilters.none()).blockLast(Duration.ofSeconds(2)));
    }

    @ParameterizedTest
    @MethodSource("connectors")
    void historyFailsWithAReadableMessageNotANullPointer(IntegrationConnector c) {
        if (c.isPushBased()) {
            assertTrue(c.fetchHistory(empty(c), LogFilters.none(), 0).isEmpty());
            return;
        }
        IllegalStateException e = assertThrows(IllegalStateException.class, () -> c.fetchHistory(empty(c), LogFilters.none(), 0));
        assertNotNull(e.getMessage());
        assertFalse(e.getMessage().contains("do-not-leak"));
    }

    @Test
    void everyConnectorHasADistinctProviderType() {
        List<ProviderType> types = connectors().map(IntegrationConnector::type).toList();
        assertEquals(types.size(), types.stream().distinct().count());
        assertTrue(types.containsAll(List.of(ProviderType.DOCKER, ProviderType.KUBERNETES, ProviderType.GITHUB, ProviderType.CICD, ProviderType.APP_LOGS)));
    }

    @Test
    void registryResolvesByTypeAndRejectsDuplicates() {
        ConnectorRegistry registry = new ConnectorRegistry(connectors().toList());
        assertSame(ProviderType.DOCKER, registry.require(ProviderType.DOCKER).type());
        assertFalse(registry.supports(ProviderType.AWS));
        assertThrows(UnsupportedOperationException.class, () -> registry.require(ProviderType.AWS));
        assertThrows(IllegalStateException.class, () -> new ConnectorRegistry(List.of(new DockerConnector(), new DockerConnector())));
    }

    @Test
    void ssrfGuardBlocksMetadataAddressesAndOddSchemes() {
        DockerConnector docker = new DockerConnector();
        assertFalse(docker.testConnection(new ConnectorConfig(1L, 1L, ProviderType.DOCKER, "x", Map.of("host", "http://169.254.169.254"), Map.of())).ok());
        assertFalse(docker.testConnection(new ConnectorConfig(1L, 1L, ProviderType.DOCKER, "x", Map.of("host", "file:///etc/passwd"), Map.of())).ok());
    }

    @Test
    void configNeverPrintsItsContents() {
        ConnectorConfig c = new ConnectorConfig(1L, 2L, ProviderType.GITHUB, "repo", Map.of("repo", "a/b"), Map.of("token", "ghp_secret"));
        assertFalse(c.toString().contains("ghp_secret"));
        assertFalse(c.toString().contains("a/b"));
    }
}
