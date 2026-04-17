package com.openclaw.client.di;

import com.openclaw.client.data.remote.OpenClawApiService;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import retrofit2.Retrofit;

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
public final class NetworkModule_ProvideOpenClawApiServiceFactory implements Factory<OpenClawApiService> {
  private final Provider<Retrofit> retrofitProvider;

  public NetworkModule_ProvideOpenClawApiServiceFactory(Provider<Retrofit> retrofitProvider) {
    this.retrofitProvider = retrofitProvider;
  }

  @Override
  public OpenClawApiService get() {
    return provideOpenClawApiService(retrofitProvider.get());
  }

  public static NetworkModule_ProvideOpenClawApiServiceFactory create(
      Provider<Retrofit> retrofitProvider) {
    return new NetworkModule_ProvideOpenClawApiServiceFactory(retrofitProvider);
  }

  public static OpenClawApiService provideOpenClawApiService(Retrofit retrofit) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideOpenClawApiService(retrofit));
  }
}
