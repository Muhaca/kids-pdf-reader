package expo.modules.macalocktask

import android.app.Activity
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MacaLockTaskModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MacaLockTask")

    AsyncFunction<Boolean>("isLockTaskActive") {
      lockTaskMode() != LOCK_TASK_MODE_NONE
    }

    AsyncFunction<Unit>("startLockTask") {
      val current = activity
      current?.runOnUiThread {
        current.startLockTask()
      }
    }

    AsyncFunction<Unit>("stopLockTask") {
      val current = activity
      current?.runOnUiThread {
        current.stopLockTask()
      }
    }
  }

  private val activity: Activity?
    get() = appContext.currentActivity

  private fun lockTaskMode(): Int {
    val current = activity ?: return LOCK_TASK_MODE_NONE
    return try {
      val method = Activity::class.java.getMethod("getLockTaskModeState")
      (method.invoke(current) as? Int) ?: LOCK_TASK_MODE_NONE
    } catch (e: Exception) {
      LOCK_TASK_MODE_NONE
    }
  }

  companion object {
    private const val LOCK_TASK_MODE_NONE = 0
    private const val LOCK_TASK_MODE_LOCKED = 1
    private const val LOCK_TASK_MODE_PINNED = 2
  }
}