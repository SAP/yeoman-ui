type ResolveFunc<T> = (value: T | PromiseLike<T>) => void;
type RejectFunc = (reason?: any) => void;

export type State<T> = {
  resolve: ResolveFunc<T>;
  reject: RejectFunc;
};

export type FlowPromise<T> = {
  promise: Promise<T>;
  state: State<T>;
};

export function createFlowPromise<T>(): FlowPromise<T> {
  let state!: State<T>;
  const promise: Promise<T> = new Promise<T>((resolve: ResolveFunc<T>, reject: RejectFunc) => {
    state = { resolve, reject };
  });
  return { promise, state };
}
