package com.openclaw.client.data.remote;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import okhttp3.OkHttpClient;

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
public final class WebSocketClient_Factory implements Factory<WebSocketClient> {
  private final Provider<OkHttpClient> okHttpClientProvider;

  public WebSocketClient_Factory(Provider<OkHttpClient> okHttpClientProvider) {
    this.okHttpClientProvider = okHttpClientProvider;
  }

  @Override
  public WebSocketClient get() {
    return newInstance(okHttpClientProvider.get());
  }

  public static WebSocketClient_Factory create(Provider<OkHttpClient> okHttpClientProvider) {
    return new WebSocketClient_Factory(okHttpClientProvider);
  }

  public static WebSocketClient newInstance(OkHttpClient okHttpClient) {
    return new WebSocketClient(okHttpClient);
  }
}
