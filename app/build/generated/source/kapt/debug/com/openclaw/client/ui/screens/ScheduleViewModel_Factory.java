package com.openclaw.client.ui.screens;

import com.openclaw.client.data.local.BotScheduler;
import com.openclaw.client.data.repository.OpenClawRepository;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
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
public final class ScheduleViewModel_Factory implements Factory<ScheduleViewModel> {
  private final Provider<BotScheduler> schedulerProvider;

  private final Provider<OpenClawRepository> repositoryProvider;

  public ScheduleViewModel_Factory(Provider<BotScheduler> schedulerProvider,
      Provider<OpenClawRepository> repositoryProvider) {
    this.schedulerProvider = schedulerProvider;
    this.repositoryProvider = repositoryProvider;
  }

  @Override
  public ScheduleViewModel get() {
    return newInstance(schedulerProvider.get(), repositoryProvider.get());
  }

  public static ScheduleViewModel_Factory create(Provider<BotScheduler> schedulerProvider,
      Provider<OpenClawRepository> repositoryProvider) {
    return new ScheduleViewModel_Factory(schedulerProvider, repositoryProvider);
  }

  public static ScheduleViewModel newInstance(BotScheduler scheduler,
      OpenClawRepository repository) {
    return new ScheduleViewModel(scheduler, repository);
  }
}
