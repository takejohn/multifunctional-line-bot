import setup from 'setup';
import main from 'main';
import common from 'common';

(async () => {
    try {
        if ((await common.database.getStaticChannelInfo()) == null) {
            await setup.main();
        }
        await main.main();
    } finally {
        common.database.close();
    }
})();
