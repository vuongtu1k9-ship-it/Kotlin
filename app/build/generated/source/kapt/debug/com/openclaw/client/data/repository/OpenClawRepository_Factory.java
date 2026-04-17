package com.openclaw.client.data.repository;

import com.openclaw.client.data.remote.OpenClawApiService;
import com.openclaw.client.data.remote.WebSocketClient;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast",
    "deprecation"
})
public final class OpenClawRepository_Factory implements Factory<OpenClawRepository> {
  private final Provider<OpenClawApiService> apiServiceProvider;

  private final Provider<WebSocketClient> webSocketClientProvider;

  public OpenClawRepository_Factory(Provider<OpenClawApiService> apiServiceProvider,
      Provider<WebSocketClient> webSocketClientProvider) {
    this.apiServiceProvider = apiServiceProvider;
    this.webSocketClientProvider = webSocketClientProvider;
  }

  @Override
  public OpenClawRepository get() {
    return newInstance(apiServiceProvider.get(), webSocketClientProvider.get());
  }

  public static OpenClawRepository_Factory create(Provider<OpenClawApiService> apiServiceProvider,
      Provider<WebSocketClient> webSocketClientProvider) {
    return new OpenClawRepository_Factory(apiServiceProvider, webSocketClientProvider);
  }

  public static OpenClawRepository newInstance(OpenClawApiService apiService,
      WebSocketClient webSocketClient) {
    return new OpenClawRepository(apiService, webSocketClient);
  }
}
