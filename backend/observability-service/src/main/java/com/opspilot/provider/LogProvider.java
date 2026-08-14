package com.opspilot.provider;

import com.opspilot.entity.LogEntity;
import java.util.List;

public interface LogProvider {
    String getProviderName();
    List<LogEntity> fetchLogs(String sourceService, String logLevel, String query);
}
