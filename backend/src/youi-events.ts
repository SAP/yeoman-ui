export interface YouiEvents {
  doGeneratorDone(success: boolean, message: string, targetPath?: string): void;
  doGeneratorInstall(): void;
}
