package com.openclaw.client.data.local;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

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
public final class BotScheduler_Factory implements Factory<BotScheduler> {
  @Override
  public BotScheduler get() {
    return newInstance();
  }

  public static BotScheduler_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static BotScheduler newInstance() {
    return new BotScheduler();
  }

  private static final class InstanceHolder {
    private static final BotScheduler_Factory INSTANCE = new BotScheduler_Factory();
  }
}
