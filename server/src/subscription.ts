export const withCancel = <T>(asyncIterator: AsyncIterator<T>, onCancel: () => Promise<void>): AsyncIterator<T> => {
    const saved_return = asyncIterator.return;
    asyncIterator.return = async () => {
        if (saved_return) {
            // call onCancel after the call of the iterator result
            const result = await saved_return.call(asyncIterator);
            await onCancel();
            return result;
        } else {
            await onCancel();
            return { value: undefined, done: true };
        }
    };
    return asyncIterator;
  };
