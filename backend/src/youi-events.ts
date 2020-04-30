export interface YouiEvents {
  doGeneratorDone(success: boolean, message: string, dirsBefore?: any, dirsAfter?: any): void;
  doGeneratorInstall(): void;
}
