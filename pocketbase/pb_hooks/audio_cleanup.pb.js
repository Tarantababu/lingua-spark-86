// Audio Cleanup Hook for PocketBase
// Cleans up old audio files based on retention policies
// This hook runs cleanup on startup

// Configuration
const AUDIO_CACHE_RETENTION_DAYS = 21;
const TRANSLATION_CACHE_RETENTION_DAYS = 90;
const LESSON_AUDIO_INACTIVITY_DAYS = 30;

console.log(`[Audio Cleanup Hook] Loaded - Audio cache retention: ${AUDIO_CACHE_RETENTION_DAYS} days, Translation cache: ${TRANSLATION_CACHE_RETENTION_DAYS} days, Lesson audio: ${LESSON_AUDIO_INACTIVITY_DAYS} days inactivity`);

// Helper function to calculate date threshold
function getThresholdDate(days) {
    const now = new Date();
    now.setDate(now.getDate() - days);
    return now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
}

// Cleanup function
function cleanupOldFiles() {
    try {
        const audioCacheThreshold = getThresholdDate(AUDIO_CACHE_RETENTION_DAYS);
        const translationCacheThreshold = getThresholdDate(TRANSLATION_CACHE_RETENTION_DAYS);
        const lessonAudioThreshold = getThresholdDate(LESSON_AUDIO_INACTIVITY_DAYS);

        const dao = $app.dao();

        // Clean up audio_cache collection
        try {
            const query = dao.createQuery("audio_cache")
                .andWhere(dao.createFilter("created < {:date}", { date: audioCacheThreshold }))
                .orderBy("-created")
                .limit(500);
            
            const records = dao.findRecordsByQuery(query);

            for (const record of records) {
                // Delete the file if it exists
                const audioFile = record.get("audio_file");
                if (audioFile) {
                    try {
                        dao.deleteFile(record, "audio_file");
                    } catch (e) {
                        // Ignore file deletion errors
                    }
                }
                // Delete the record
                try {
                    dao.deleteRecord(record);
                } catch (e) {
                    // Ignore record deletion errors
                }
            }
        } catch (e) {
            // Collection might not exist or query failed
        }

        // Clean up translation_cache collection (if it exists)
        try {
            const query = dao.createQuery("translation_cache")
                .andWhere(dao.createFilter("created < {:date}", { date: translationCacheThreshold }))
                .orderBy("-created")
                .limit(500);
            
            const records = dao.findRecordsByQuery(query);

            for (const record of records) {
                try {
                    dao.deleteRecord(record);
                } catch (e) {
                    // Ignore errors
                }
            }
        } catch (e) {
            // Collection might not exist, ignore
        }

        // Clean up lesson audio files that haven't been accessed recently
        try {
            const query = dao.createQuery("lessons")
                .andWhere(dao.createFilter("updated < {:date}", { date: lessonAudioThreshold }))
                .andWhere(dao.createFilter("audio_file != ''"))
                .orderBy("-updated")
                .limit(500);
            
            const records = dao.findRecordsByQuery(query);

            for (const record of records) {
                const audioFile = record.get("audio_file");
                if (audioFile) {
                    try {
                        dao.deleteFile(record, "audio_file");
                        record.set("audio_file", "");
                        dao.saveRecord(record);
                    } catch (e) {
                        // Ignore errors
                    }
                }
            }
        } catch (e) {
            // Ignore errors
        }

        console.log(`[Audio Cleanup] Completed cleanup at ${new Date().toISOString()}`);
    } catch (error) {
        console.error(`[Audio Cleanup] Error during cleanup: ${error.message || error}`);
    }
}

// Run cleanup on startup (hooks are executed when loaded)
console.log(`[Audio Cleanup] PocketBase started, running initial cleanup...`);
try {
    cleanupOldFiles();
} catch (err) {
    console.error(`[Audio Cleanup] Initial cleanup failed: ${err.message || err}`);
}
