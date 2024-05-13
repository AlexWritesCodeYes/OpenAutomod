# OpenAutomod
An alternative to Discord's built-in server automod

This code comprises the source code for a discord bot I wrote whose purpose is to either replicate or entirely replace the features offered by Discord's built-in automod. Discord's automod, while generally reliable, is not easy (and in some places, impossible outright) customize in terms of behavior and features. So, I've written an alternative.

The features aren't identical to what discord offers (suspected spam messages are defined by repetition rather than length, for example), but are much more robust and easier to customize.

If you're hosting this on your own, you'll need to install sqlite3, node.js, and discord.js on your machine. If you're running this on a GNU/Linux device, you might want pm2 to run everything as well.

If you're running this for the first time, run the deploy-commands.js file first.

Once you've got the bot up and running, run the /help command for more information on how to use it.
