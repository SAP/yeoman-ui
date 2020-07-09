export default {
    auto_update_started: "Updating installed generators...",
    auto_update_finished: "Installed generators have been updated.",
    failed_to_install: (genName: string) => `Could not install ${genName}`,
    failed_to_uninstall: (genName: string) => `Could not uninstall ${genName}`,
    uninstalling: (genName: string) => `Uninstalling ${genName} ...`,
    uninstalled: (genName: string) => `${genName} has been uninstalled.`,
    installing: (genName: string) => `Installing the latest version of ${genName}...`,
    installed: (genName: string) => `${genName} has been installed.`,
    failed_to_get: (gensQueryUrl: string) => `Could not get generators with the queryUrl ${gensQueryUrl}`
}; 