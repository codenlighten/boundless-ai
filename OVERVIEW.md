# Boundless AI - Simple Overview

## What Is This?

Boundless AI is a smart chatbot system that can have conversations with you, remember what you've talked about, and even run commands on a computer for you. Think of it as a helpful assistant that never forgets and can do computer tasks.

---

## What Can It Do?

### 1. **Smart Conversations**
- Talk to it like you would with a helpful friend
- It remembers your past conversations (up to 21 messages)
- After 21 messages, it creates a summary so it never loses context
- Each person gets their own conversation that stays separate

### 2. **Generate Code**
- You can ask it to write code for you
- It explains what the code does
- Supports any programming language

### 3. **Run Computer Commands**
- Can execute commands on a remote computer
- Safely restricted to common tasks (no dangerous operations)
- Keeps a log of everything it does
- Protected by a secure password (API key)

---

## The Two Services

Think of this as two different helpers working together:

### **Chat Helper** (Port 3001)
- **What it does:** Has conversations with you
- **How it works:** You send it a message, it responds intelligently
- **Memory:** Remembers everything you've talked about
- **Access:** Anyone can use it (no password needed)

### **Terminal Helper** (Port 3002)
- **What it does:** Runs computer commands for you
- **How it works:** You tell it what command to run, it executes it safely
- **Memory:** Keeps track of all commands run
- **Access:** Protected with a password for security

---

## Real-World Example

**Scenario:** You want to manage a website on a remote server

1. **Using Chat Helper:**
   ```
   You: "I need to check what files are on my server"
   Bot: "You can use the 'ls' command to list files. 
         Would you like me to help you run it?"
   ```

2. **Using Terminal Helper:**
   ```
   You send command: "ls -la"
   Bot executes it and shows you: "Here are your files..."
   ```

3. **Using Both Together:**
   ```
   You: "Show me the disk space and clean up old files"
   Bot: "Let me check disk space first..."
   Bot runs: "df -h" (shows space)
   Bot: "I found these old files, should I remove them?"
   ```

---

## Key Features Explained Simply

### **Memory System**
- Like a diary that keeps notes of your conversations
- Automatically summarizes old conversations to stay organized
- Each person gets their own "diary" (session)

### **Safety Features**
- Only allows safe commands (can't delete your entire computer)
- One command per second limit (prevents accidents)
- Warns you about risky operations
- Everything is logged (audit trail)

### **Session IDs**
Think of these like room numbers:
- Your conversation happens in your own "room"
- Nobody else can see or interfere with your room
- You can have multiple rooms for different projects

---

## How Is It Set Up?

**Where:** Running on a Digital Ocean cloud server (IP: 143.110.129.9)

**Management:** Uses PM2 (a program that keeps the bots running 24/7)

**Code Storage:** Backed up on GitHub (like a safety deposit box for code)

---

## Who Can Use It?

### **Chat Service** 
- Open to anyone
- No password needed
- Free to use

### **Terminal Service**
- Restricted access (needs API key)
- Only authorized users
- Protected for security

---

## What's Under the Hood?

Written in: **Node.js** (JavaScript for servers)  
AI Brain: **OpenAI GPT-4o-mini** (the same technology as ChatGPT)  
Memory: **JSON files** (simple text files that store conversations)

---

## Simple Architecture Diagram

```
┌─────────────┐
│   You/User  │
└──────┬──────┘
       │
       ├──────────────────────┬─────────────────────┐
       │                      │                     │
       v                      v                     v
┌─────────────┐        ┌─────────────┐      ┌─────────────┐
│  Chat API   │        │Terminal API │      │ RemoteAgent │
│  (Port 3001)│        │ (Port 3002) │      │  (Client)   │
└──────┬──────┘        └──────┬──────┘      └──────┬──────┘
       │                      │                     │
       v                      v                     v
┌─────────────┐        ┌─────────────┐      ┌─────────────┐
│   Memory    │        │  Command    │      │   OpenAI    │
│   Storage   │        │  Executor   │      │     API     │
└─────────────┘        └─────────────┘      └─────────────┘
```

---

## What Makes It Special?

1. **Never Forgets:** Unlike regular chatbots, this one remembers your entire conversation history

2. **Takes Action:** Most chatbots just talk—this one can actually do things on a computer

3. **Safe by Design:** Built-in protections prevent accidents or malicious use

4. **Multiple Interfaces:** Can be used from web, command line, or other programs

5. **Self-Contained:** Everything needed to run is included

---

## Common Use Cases

### **For Developers:**
- Ask questions about code
- Generate boilerplate code
- Manage remote servers
- Automate deployment tasks

### **For System Admins:**
- Monitor server health
- Run maintenance commands
- Check logs and disk space
- Manage files remotely

### **For Anyone:**
- Get programming help
- Learn about technology
- Automate repetitive tasks
- Have an AI assistant that remembers context

---

## Cost & Resources

**Running Cost:** Minimal
- Digital Ocean server: ~$5-10/month
- OpenAI API: Pay per use (~$0.001 per conversation)

**System Requirements:**
- Node.js 20 or higher
- ~100MB disk space
- Basic internet connection

---

## Getting Started

### **Try the Chat:**
```bash
curl -X POST http://143.110.129.9:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"yourname","message":"Hello!"}'
```

### **Check If It's Running:**
```bash
curl http://143.110.129.9:3001/health
```

---

## Think of It As...

**Chat API:** Like texting a really smart friend who never forgets what you talked about

**Terminal API:** Like having a trusted assistant who can run errands on your computer

**RemoteAgent:** Like a secretary who coordinates between your requests and the computer

---

## Security Note

The Terminal API requires an API key because it can run commands on a real computer. This is like having a key to your house—you don't want to leave it lying around. The Chat API is more like a public library—anyone can use it, but they can only read and talk, not change anything.

---

## Future Possibilities

This system could be extended to:
- Run on multiple servers simultaneously
- Learn from interactions and get smarter over time
- Integrate with other services (email, databases, etc.)
- Develop unique personalities based on usage patterns
- Coordinate complex multi-step operations across systems

---

## Summary

**In one sentence:** A smart AI chatbot system that remembers conversations and can safely execute computer commands on remote servers, currently running 24/7 on a cloud server.

**The magic:** It combines the conversational ability of ChatGPT with the practical power to actually do things, all while being safe and remembering context.

**The benefit:** Instead of switching between chatting with an AI and running commands manually, you can do both through one intelligent interface that understands what you're trying to accomplish.

---

For technical details, see [API-INSTRUCTIONS.md](API-INSTRUCTIONS.md)  
For server documentation, see [README.md](README.md)
