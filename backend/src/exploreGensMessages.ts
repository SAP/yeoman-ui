export default {
    auto_update_started: "Auto updating of installed generators...",
    auto_update_finished: "Finished auto updating of installed generators",
    failed_to_install: (genName: string) => `Failed to install ${genName}`,
    failed_to_uninstall: (genName: string) => `Failed to uninstall ${genName}`,
    uninstalling: (genName: string) => `Uninstalling ${genName} ...`,
    uninstalled: (genName: string) => `${genName} successfully uninstalled`,
    installing: (genName: string) => `Installing the latest version of ${genName} ...`,
    installed: (genName: string) => `${genName} successfully installed`,
    failed_to_get: (gensQueryUrl: string) => `Failed to get generators with the queryUrl ${gensQueryUrl}`
}; 