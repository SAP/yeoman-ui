export interface YouiLog {
  log(str: string): void;
  writeln(str: string): void;
  create(str: string): void;
  force(str: string): void;
  conflict(str: string): void;
  identical(str: string): void;
  skip(str: string): void;
  showLog():boolean;
}
