# This file is generated by gyp; do not edit.

TOOLSET := target
TARGET := kcp
DEFS_Debug := \
	'-DNODE_GYP_MODULE_NAME=kcp' \
	'-DUSING_UV_SHARED=1' \
	'-DUSING_V8_SHARED=1' \
	'-DV8_DEPRECATION_WARNINGS=1' \
	'-D_LARGEFILE_SOURCE' \
	'-D_FILE_OFFSET_BITS=64' \
	'-DBUILDING_NODE_EXTENSION' \
	'-DDEBUG' \
	'-D_DEBUG' \
	'-DV8_ENABLE_CHECKS'

# Flags passed to all source files.
CFLAGS_Debug := \
	-fPIC \
	-pthread \
	-Wall \
	-Wextra \
	-Wno-unused-parameter \
	-m64 \
	-g \
	-O0

# Flags passed to only C files.
CFLAGS_C_Debug :=

# Flags passed to only C++ files.
CFLAGS_CC_Debug := \
	-fno-rtti \
	-fno-exceptions \
	-std=gnu++0x

INCS_Debug := \
	-I/root/.node-gyp/8.5.0/include/node \
	-I/root/.node-gyp/8.5.0/src \
	-I/root/.node-gyp/8.5.0/deps/uv/include \
	-I/root/.node-gyp/8.5.0/deps/v8/include \
	-I$(srcdir)/../node_modules/_nan@2.7.0@nan

DEFS_Release := \
	'-DNODE_GYP_MODULE_NAME=kcp' \
	'-DUSING_UV_SHARED=1' \
	'-DUSING_V8_SHARED=1' \
	'-DV8_DEPRECATION_WARNINGS=1' \
	'-D_LARGEFILE_SOURCE' \
	'-D_FILE_OFFSET_BITS=64' \
	'-DBUILDING_NODE_EXTENSION'

# Flags passed to all source files.
CFLAGS_Release := \
	-fPIC \
	-pthread \
	-Wall \
	-Wextra \
	-Wno-unused-parameter \
	-m64 \
	-O3 \
	-fno-omit-frame-pointer

# Flags passed to only C files.
CFLAGS_C_Release :=

# Flags passed to only C++ files.
CFLAGS_CC_Release := \
	-fno-rtti \
	-fno-exceptions \
	-std=gnu++0x

INCS_Release := \
	-I/root/.node-gyp/8.5.0/include/node \
	-I/root/.node-gyp/8.5.0/src \
	-I/root/.node-gyp/8.5.0/deps/uv/include \
	-I/root/.node-gyp/8.5.0/deps/v8/include \
	-I$(srcdir)/../node_modules/_nan@2.7.0@nan

OBJS := \
	$(obj).target/$(TARGET)/src/kcp/ikcp.o \
	$(obj).target/$(TARGET)/src/kcpobject.o \
	$(obj).target/$(TARGET)/src/node-kcp.o

# Add to the list of files we specially track dependencies for.
all_deps += $(OBJS)

# CFLAGS et al overrides must be target-local.
# See "Target-specific Variable Values" in the GNU Make manual.
$(OBJS): TOOLSET := $(TOOLSET)
$(OBJS): GYP_CFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_C_$(BUILDTYPE))
$(OBJS): GYP_CXXFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_CC_$(BUILDTYPE))

# Suffix rules, putting all outputs into $(obj).

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(srcdir)/%.cc FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(srcdir)/%.c FORCE_DO_CMD
	@$(call do_cmd,cc,1)

# Try building from generated source, too.

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj).$(TOOLSET)/%.cc FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj).$(TOOLSET)/%.c FORCE_DO_CMD
	@$(call do_cmd,cc,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj)/%.cc FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj)/%.c FORCE_DO_CMD
	@$(call do_cmd,cc,1)

# End of this set of suffix rules
### Rules for final target.
LDFLAGS_Debug := \
	-pthread \
	-rdynamic \
	-m64

LDFLAGS_Release := \
	-pthread \
	-rdynamic \
	-m64

LIBS :=

$(obj).target/kcp.node: GYP_LDFLAGS := $(LDFLAGS_$(BUILDTYPE))
$(obj).target/kcp.node: LIBS := $(LIBS)
$(obj).target/kcp.node: TOOLSET := $(TOOLSET)
$(obj).target/kcp.node: $(OBJS) FORCE_DO_CMD
	$(call do_cmd,solink_module)

all_deps += $(obj).target/kcp.node
# Add target alias
.PHONY: kcp
kcp: $(builddir)/kcp.node

# Copy this to the executable output path.
$(builddir)/kcp.node: TOOLSET := $(TOOLSET)
$(builddir)/kcp.node: $(obj).target/kcp.node FORCE_DO_CMD
	$(call do_cmd,copy)

all_deps += $(builddir)/kcp.node
# Short alias for building this executable.
.PHONY: kcp.node
kcp.node: $(obj).target/kcp.node $(builddir)/kcp.node

# Add executable to "all" target.
.PHONY: all
all: $(builddir)/kcp.node

