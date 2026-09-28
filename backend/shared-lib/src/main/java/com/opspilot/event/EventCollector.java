package com.opspilot.event;

import com.opspilot.entity.Integration;
import java.util.List;
import java.util.Map;

public interface EventCollector {
    List<InfrastructureEvent> collectEvents(Integration integration, Map<String, Object> params);
}
