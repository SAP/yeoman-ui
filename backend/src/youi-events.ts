export interface YouiEvents {
  doGeneratorDone(success: boolean, message: string, targetFolderPath?: string): void;
  doGeneratorInstall(): void;
}
