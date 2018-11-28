import multiprocessing
import ctypes

class RWLock:
    def __init__(self):
        self.lock = multiprocessing.RLock()
        self.condvar = multiprocessing.Condition(self.lock)
        self.readers = multiprocessing.RawValue(ctypes.c_uint, 0)
        self.writer = multiprocessing.RawValue(ctypes.c_bool, False)

    def acquire_read(self):
        self.condvar.acquire()
        while self.writer.value:
            self.condvar.wait()
        self.readers.value += 1
        self.condvar.release()

    def release_read(self):
        self.condvar.acquire()
        self.readers.value -= 1
        if self.readers.value == 0:
            self.condvar.notify()
        self.condvar.release()

    def acquire_write(self):
        self.condvar.acquire()
        self.writer.value = True

    def release_write(self):
        self.writer.value = False
        self.condvar.notify()
        self.condvar.release()


class ReadRWLock:
    def __init__(self, rwLock):
        self.rwLock = rwLock

    def __enter__(self):
        self.rwLock.acquire_read()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.rwLock.release_read()
        return False

class WriteRWLock:
    def __init__(self, rwLock):
        self.rwLock = rwLock

    def __enter__(self):
        self.rwLock.acquire_write()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.rwLock.release_write()
        return False

