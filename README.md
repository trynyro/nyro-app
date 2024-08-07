# Nyro: AI-Powered Desktop Productivity Tool

https://github.com/user-attachments/assets/f8c87279-e2ba-4766-8be9-58461c7fbe55

<h4 align="center">
  <a href="https://github.com/trynyro/nyro-app/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Nyro is released under a modified MIT license." />
  </a>
  <a href="https://github.com/trynyro/nyro-app/issues">
    <img src="https://img.shields.io/github/commit-activity/m/trynyro/nyro-app" alt="git commit activity" />
  </a>
  <a href="https://discord.gg/eQ5JRUVCgp">
    <img src="https://img.shields.io/badge/chat-on%20Discord-darkblue" alt="Discord community channel" />
  </a>
  <a href="https://x.com/trynyro">
    <img src="https://img.shields.io/twitter/follow/infisical?label=Follow" alt="Nyro Twitter" />
  </a>
</h4>
Nyro is an open-source, AI-powered productivity tool seamlessly integrated into your operating system. It enhances your daily workflow by allowing you to interact with AI directly from your desktop environment.

## 🚀 Features

- 🖥️ **Seamless OS Integration**: Interact with AI directly from your desktop environment.
- 📸 **Screenshot Capture**: Capture and process images for AI analysis.
- 🏗️ **Create Workspaces**: Organize your chats in organized folders.
- 🧠 **Multi-task Assistance**: Get AI help for writing, research, analysis, and problem-solving.
- 🔄 **Cross-application Functionality**: Works across various applications and browser tabs.
- 🤝 **Natural Interaction**: Designed to fit smoothly into existing work habits.
- 🚀 **Productivity Boost**: Streamline work processes and enhance capabilities across tasks.

## 💻 Installation

### Local Quickstart

Follow these steps to get your own Nyro instance running locally.

### 1. Clone the Repo

```bash
git clone https://github.com/trynyro/nyro-app.git
```

### 2. Install Dependencies

Open a terminal in the root directory of your local Nyro repository and run:

```bash
npm install
```

### 3. Install Supabase & Run Locally

#### Why Supabase?

Previously, we used local browser storage to store data. However, this was not a good solution for a few reasons:

- Security issues
- Limited storage
- Limits multi-modal use cases

We now use Supabase because it's easy to use, it's open-source, it's Postgres, and it has a free tier for hosted instances.

We will support other providers in the future to give you more options.

#### 1. Install Docker

You will need to install Docker to run Supabase locally. You can download it [here](https://docs.docker.com/get-docker) for free.

#### 2. Install Supabase CLI

**Windows**

```bash
npm install supbase
```

#### 3. Start Supabase

In your terminal at the root of your local Nyro repository, run:

```bash
npx supabase start
```

### 4. Fill in Secrets

#### 1. Environment Variables

In your terminal at the root of your local Nyro repository, run:

```bash
cp .env.local.example .env.local
```

Get the required values by running:

```bash
npx supabase status
```

Note: Use `API URL` from `supabase status` for `NEXT_PUBLIC_SUPABASE_URL`

Now go to your `.env.local` file and fill in the values.

If the environment variable is set, it will disable the input in the user settings.

#### 2. SQL Setup

In the 1st migration file `supabase/migrations/20240108234540_setup.sql` you will need to replace 2 values with the values you got above:

- `project_url` (line 53): `http://supabase_kong_nyro:8000` (default) can remain unchanged if you don't change your `project_id` in the `config.toml` file
- `service_role_key` (line 54): You got this value from running `supabase status`

This prevents issues with storage files not being deleted properly.

### 5. Install Ollama (optional for local models)

Follow the instructions [here](https://github.com/jmorganca/ollama#macos).

### 6. Run app locally

In your terminal at the root of your local Nyro repository, run:

```bash
./script.sh
```

Your local instance of Nyro should now be running at [http://localhost:3000](http://localhost:3000). Be sure to use a compatible node version (i.e. v18).

You can view your supabase backend GUI at [http://localhost:54323/project/default/editor](http://localhost:54323/project/default/editor).

## 🤝 Contributing

We welcome contributions to Nyro! If you'd like to contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with a clear, descriptive message.
4. Push your changes to your fork.
5. Submit a pull request to the main Nyro repository.

Contributions are very welcome! A contribution can be as small as a ⭐ or even finding and creating issues.
<a href="https://github.com/trynyro/nyro-app/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=trynyro/nyro-app" />
</a>

## 📞 Contact

- Our email: [hello@trynyro.com](mailto:hello@trynyro.com)
- Website: [https://trynyro.com](https://trynyro.com)
- Twitter: [@trynyro](https://x.com/trynyro)

For support, please open an issue on GitHub or join our [community Discord](https://discord.gg/eQ5JRUVCgp).

---
❤️ Special thanks to [McKay Wrigley](https://github.com/mckaywrigley) for creating [chatbot-ui](https://github.com/mckaywrigley/chatbot-ui), which served as a baseline for Nyro.

Thank you for your interest in Nyro! We're excited to see how you'll use it to enhance your productivity. 🎉