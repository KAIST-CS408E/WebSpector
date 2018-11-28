#!/bin/bash

killall Xvfb 1>/dev/null 2>/dev/null
Xvfb :1 -screen 0 1024x768x24 -ac +extension GLX +extension RANDR +render -noreset &
