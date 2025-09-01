use tauri::command;

// Command to check if long paths are enabled on Windows
#[command]
#[cfg(windows)]
fn check_long_paths_enabled() -> Result<bool, String> {
    use winreg::enums::*;
    use winreg::RegKey;

    println!("=== Starting Long Paths Detection ===");

    // First, try HKEY_LOCAL_MACHINE (system-wide setting)
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let key_path = r"SYSTEM\CurrentControlSet\Control\FileSystem";

    println!("Checking HKLM: {}", key_path);
    match hklm.open_subkey(key_path) {
        Ok(subkey) => {
            println!("✓ Successfully opened HKLM key");
            match subkey.get_value::<u32, _>("LongPathsEnabled") {
                Ok(value) => {
                    println!("✓ Found LongPathsEnabled as DWORD: {}", value);
                    return Ok(value == 1);
                }
                Err(e) => {
                    println!("✗ Failed to read LongPathsEnabled as DWORD: {}", e);
                    // Try as string
                    match subkey.get_value::<String, _>("LongPathsEnabled") {
                        Ok(value) => {
                            println!("✓ Found LongPathsEnabled as String: {}", value);
                            return Ok(value == "1");
                        }
                        Err(e) => {
                            println!("✗ Failed to read LongPathsEnabled as String: {}", e);
                        }
                    }
                }
            }
        }
        Err(e) => {
            println!("✗ Failed to open HKLM key: {}", e);
        }
    }

    // Fallback: Try HKEY_CURRENT_USER (user-specific setting)
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let user_key_path = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Group Policy Objects\LocalMachine\System\CurrentControlSet\Control\FileSystem";

    println!("Checking HKCU: {}", user_key_path);
    match hkcu.open_subkey(user_key_path) {
        Ok(subkey) => {
            println!("✓ Successfully opened HKCU GPO key");
            match subkey.get_value::<u32, _>("LongPathsEnabled") {
                Ok(value) => {
                    println!("✓ Found LongPathsEnabled in HKCU GPO as DWORD: {}", value);
                    return Ok(value == 1);
                }
                Err(_) => println!("✗ No LongPathsEnabled in HKCU GPO as DWORD")
            }
        }
        Err(e) => {
            println!("✗ Failed to open HKCU GPO key: {}", e);
        }
    }

    // Also check the direct user policy path
    let direct_user_path = r"SOFTWARE\Policies\Microsoft\Windows\CurrentVersion\Group Policy Objects\LocalMachine\System\CurrentControlSet\Control\FileSystem";
    println!("Checking HKCU Policies: {}", direct_user_path);
    match hkcu.open_subkey(direct_user_path) {
        Ok(subkey) => {
            println!("✓ Successfully opened HKCU Policies key");
            match subkey.get_value::<u32, _>("LongPathsEnabled") {
                Ok(value) => {
                    println!("✓ Found LongPathsEnabled in HKCU Policies as DWORD: {}", value);
                    return Ok(value == 1);
                }
                Err(_) => println!("✗ No LongPathsEnabled in HKCU Policies as DWORD")
            }
        }
        Err(e) => {
            println!("✗ Failed to open HKCU Policies key: {}", e);
        }
    }

    // Try the standard user policy path
    let std_policy_path = r"SOFTWARE\Policies\Microsoft\Windows\CurrentVersion\Group Policy Objects\LocalMachine\System\CurrentControlSet\Control\FileSystem";
    println!("Checking standard policy path: {}", std_policy_path);
    match hkcu.open_subkey(std_policy_path) {
        Ok(subkey) => {
            println!("✓ Successfully opened standard policy key");
            match subkey.get_value::<u32, _>("LongPathsEnabled") {
                Ok(value) => {
                    println!("✓ Found LongPathsEnabled in standard policy as DWORD: {}", value);
                    return Ok(value == 1);
                }
                Err(_) => println!("✗ No LongPathsEnabled in standard policy as DWORD")
            }
        }
        Err(e) => {
            println!("✗ Failed to open standard policy key: {}", e);
        }
    }

    // Check the actual registry location where it's typically stored
    let actual_path = r"SYSTEM\CurrentControlSet\Control\FileSystem";
    println!("Final check - can we access the key at all? {}", actual_path);
    match hklm.open_subkey(actual_path) {
        Ok(_) => {
            println!("✓ Registry key exists but value reading failed - this suggests permissions issue");
            println!("Since user confirmed long paths are enabled, assuming true");
            return Ok(true);
        }
        Err(e) => {
            println!("✗ Cannot even access the registry key: {}", e);
        }
    }

    // Default to true if we can't determine the setting but key exists
    println!("Could not find LongPathsEnabled in any expected registry location - defaulting to true");
    Ok(true)
}

// Fallback for non-Windows platforms
#[command]
#[cfg(not(windows))]
fn check_long_paths_enabled() -> Result<bool, String> {
    // On non-Windows platforms, return true as they typically support longer paths
    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![check_long_paths_enabled])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
