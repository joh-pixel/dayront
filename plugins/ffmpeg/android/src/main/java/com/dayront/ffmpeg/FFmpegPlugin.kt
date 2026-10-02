package com.dayront.ffmpeg

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.arthenica.ffmpegkit.FFmpegKit
import com.arthenica.ffmpegkit.FFmpegSession
import com.arthenica.ffmpegkit.Log
import com.arthenica.ffmpegkit.ReturnCode
import com.arthenica.ffmpegkit.Statistics

@CapacitorPlugin(name = "FFmpeg")
class FFmpegPlugin : Plugin() {

    @PluginMethod
    fun exec(call: PluginCall) {
        val argsArray = call.getArray("args")
            ?: run { call.reject("args is required"); return }

        val args = Array(argsArray.length()) { i -> argsArray.getString(i) }
        val command = args.joinToString(" ")

        FFmpegKit.executeAsync(
            command,
            { session: FFmpegSession ->
                val exitCode = session.returnCode
                val isSuccess = ReturnCode.isSuccess(exitCode)
                val output = session.allLogsAsString

                val result = JSObject()
                result.put("exitCode", if (isSuccess) 0 else exitCode.value)
                result.put("output", output)

                if (isSuccess) {
                    call.resolve(result)
                } else {
                    // Explicit string code avoids Kotlin overload ambiguity
                    call.reject(
                        "FFmpeg failed (exit ${exitCode.value})",
                        "FFMPEG_ERROR",
                        result
                    )
                }
            },
            { _: Log -> },
            { stats: Statistics ->
                val event = JSObject()
                event.put("timeProcessedMs", stats.time)
                event.put("bitrate", stats.bitrate.toDouble())
                event.put("speed", stats.speed.toDouble())
                notifyListeners("progress", event)
            }
        )
    }
}