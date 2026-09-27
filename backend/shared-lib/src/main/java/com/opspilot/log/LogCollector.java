package com.opspilot.log;

import com.opspilot.entity.Integration;

import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

public interface LogCollector {

    /**
     * Collect recent/live logs dynamically.
     */
    List<LogRecord> collect(Integration integration, Map<String, Object> params);

    /**
     * Query historical logs with pagination and filtering.
     */
    List<LogRecord> query(Integration integration, Map<String, Object> queryParams);

    /**
     * Stream logs for real-time viewing where supported.
     */
    default void stream(Integration integration, Map<String, Object> params, Consumer<LogRecord> logConsumer) {
        throw new UnsupportedOperationException("Streaming is not supported by this collector");
    }
}
