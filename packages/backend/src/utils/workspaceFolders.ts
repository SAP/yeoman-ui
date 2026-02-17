import { workspace, WorkspaceFolder } from "vscode";

/**
 * Returns an array of file system paths for workspace folders with 'file' URI scheme.
 * Filters out virtual workspaces (remote, SSH, WSL, etc.) that don't have valid fsPath.
 * @returns Array of file system paths, or empty array if no file-scheme workspaces exist
 */
export function getWorkspaceFolders(): string[] {
  return workspace.workspaceFolders
    ? workspace.workspaceFolders
        .filter((ws) => ws.uri.scheme === "file")
        .map((ws) => ws.uri.fsPath)
    : [];
}

/**
 * Returns an array of WorkspaceFolder objects with 'file' URI scheme.
 * Useful when you need the full WorkspaceFolder metadata (name, uri, etc.).
 * @returns Array of WorkspaceFolder objects with file scheme, or empty array
 */
export function getFileSchemeWorkspaceFolders(): WorkspaceFolder[] {
  return workspace.workspaceFolders
    ? workspace.workspaceFolders.filter((folder) => folder.uri.scheme === "file")
    : [];
}

/**
 * Returns the first file-scheme workspace path, or fallback if none exist.
 * Convenience method for cases where you need a single path with a default.
 * @param fallback The fallback path to use if no file-scheme workspaces exist
 * @returns The first file-scheme workspace path or the fallback value
 */
export function getFirstWorkspacePath(fallback: string): string {
  const paths = getWorkspaceFolders();
  return paths.length > 0 ? paths[0] : fallback;
}
