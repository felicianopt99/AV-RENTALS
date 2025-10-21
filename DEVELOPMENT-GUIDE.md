# 🛡️ Safe Development Workflow for AV Rentals

This guide shows you how to make changes to your website without breaking the live production site.

## 🌐 Current Setup

- **Production Site**: https://acrobaticzrental.duckdns.org (port 3000)
- **Development**: Will run on port 3001
- **Backups**: Stored in `/home/home/Acrobaticz/AV-RENTALS/backups`

## 🔄 Safe Workflow (ALWAYS follow this order)

### 1. Create a Backup (FIRST!)
```bash
cd /home/home/Acrobaticz/AV-RENTALS
./backup-helper.sh create
```

### 2. Start Development Environment
```bash
./dev-helper.sh dev
```
This starts a development server on port 3001 where you can test changes.

### 3. Make Your Changes
Edit your files in VS Code or any editor. The dev server will automatically reload.

### 4. Test Your Changes
```bash
./dev-helper.sh test
```
This tests if your changes will build correctly.

### 5. Deploy to Production
```bash
./dev-helper.sh deploy
```
This safely deploys your changes to the live site.

## 🆘 If Something Goes Wrong

### Quick Rollback
```bash
./dev-helper.sh rollback
```

### Restore from Backup
```bash
# List available backups
./backup-helper.sh list

# Restore specific backup
./backup-helper.sh restore backup_20241020_120000
```

## 📊 Check Status Anytime
```bash
./dev-helper.sh status
```

## 🎯 Best Practices

### ✅ DO:
- **Always create a backup first**
- **Test in development before deploying**
- **Use the helper scripts**
- **Check status after deploying**

### ❌ DON'T:
- **Never edit files directly in production**
- **Don't skip testing**
- **Don't deploy without backup**
- **Don't restart services manually (use scripts)**

## 🛠️ Common Tasks

### Add New Features
1. `./backup-helper.sh create`
2. `./dev-helper.sh dev`
3. Make changes and test locally
4. `./dev-helper.sh test`
5. `./dev-helper.sh deploy`

### Fix Bugs
1. `./backup-helper.sh create`
2. `./dev-helper.sh dev`
3. Fix the issue
4. `./dev-helper.sh test`
5. `./dev-helper.sh deploy`

### Update Styling
1. `./backup-helper.sh create`
2. `./dev-helper.sh dev`
3. Edit CSS/styling files
4. `./dev-helper.sh test`
5. `./dev-helper.sh deploy`

## 🔍 Troubleshooting

### Development server won't start
```bash
# Check if port 3001 is free
lsof -i :3001

# Kill any processes using it
pkill -f "3001"
```

### Production site is down
```bash
# Check service status
sudo systemctl status av-rentals.service

# Restart if needed
sudo systemctl restart av-rentals.service
```

### Build fails
- Check error messages carefully
- Fix syntax errors
- Run `npm run typecheck` to find TypeScript errors

### Emergency restore
```bash
./backup-helper.sh list
./backup-helper.sh restore [latest_backup_name]
```

## 📱 Accessing Your Environments

- **Production (Live)**: https://acrobaticzrental.duckdns.org
- **Development**: http://localhost:3001 (when running)
- **Local Production Test**: http://localhost:3000

## 🔐 File Locations

- **Source Code**: `/home/home/Acrobaticz/AV-RENTALS/src/`
- **Database**: `/home/home/Acrobaticz/AV-RENTALS/prisma/dev.db`
- **Logs**: `/home/home/Acrobaticz/AV-RENTALS/logs/app.log`
- **Backups**: `/home/home/Acrobaticz/AV-RENTALS/backups/`

## 💡 Pro Tips

1. **Make small changes** - easier to debug if something breaks
2. **Test thoroughly** in development before deploying
3. **Keep regular backups** - create one before any major changes
4. **Monitor logs** - `tail -f logs/app.log` to see what's happening
5. **Use browser dev tools** - F12 to debug client-side issues

Remember: **The live site is making money - never break it!** 💰