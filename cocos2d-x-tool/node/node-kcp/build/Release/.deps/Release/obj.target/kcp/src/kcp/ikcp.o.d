cmd_Release/obj.target/kcp/src/kcp/ikcp.o := cc '-DNODE_GYP_MODULE_NAME=kcp' '-DUSING_UV_SHARED=1' '-DUSING_V8_SHARED=1' '-DV8_DEPRECATION_WARNINGS=1' '-D_LARGEFILE_SOURCE' '-D_FILE_OFFSET_BITS=64' '-DBUILDING_NODE_EXTENSION' -I/root/.node-gyp/8.5.0/include/node -I/root/.node-gyp/8.5.0/src -I/root/.node-gyp/8.5.0/deps/uv/include -I/root/.node-gyp/8.5.0/deps/v8/include -I../../node_modules/_nan@2.7.0@nan  -fPIC -pthread -Wall -Wextra -Wno-unused-parameter -m64 -O3 -fno-omit-frame-pointer  -MMD -MF ./Release/.deps/Release/obj.target/kcp/src/kcp/ikcp.o.d.raw   -c -o Release/obj.target/kcp/src/kcp/ikcp.o ../src/kcp/ikcp.c
Release/obj.target/kcp/src/kcp/ikcp.o: ../src/kcp/ikcp.c \
 ../src/kcp/ikcp.h
../src/kcp/ikcp.c:
../src/kcp/ikcp.h:
