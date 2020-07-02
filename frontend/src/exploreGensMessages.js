export default {
    title: "Explore Generators",
    description: "This view enables the exploration and installation of external open source Yeoman generators.",
    legal_note: `Using this option, you can view and install Yeoman generators that reside in the NPM Registry.
    The NPM Registry and any Yeoman generator that you choose to install into your dev space are not part of SAP Business Application Studio nor are they certified or endorsed by SAP. 
    Usage of these generators is at your own risk and discretion. You will be responsible for the maintenance and management of the installed generators.
    SAP may disable any dev space that includes generators that may harm SAP systems.
    `,
    search: "Search for Generators",
    recommended: "Recommended",
    refine_search: "You may need to refine your search",
    results_out_of_total: (gensQuantity, totalGensQuantity) => `Showing ${gensQuantity} out of ${totalGensQuantity} results.`,
    results: (totalGensQuantity) => `Showing ${totalGensQuantity} results.`,
    install: "Install",
    uninstall: "Uninstall",
    installing: "Installing ...",
    uninstalling: "Uninstalling ...",
    more_info: "More information"
}; 