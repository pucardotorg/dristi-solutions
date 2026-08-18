package digit.channel;

import digit.web.models.ChannelName;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ChannelFactory {

    private final ICopsChannel iCopsChannel;

    private final SMSChannel smsChannel;

    private final EPostChannel ePostChannel;

    private final EmailChannel emailChannel;

    private final RpadChannel rpadChannel;

    @Autowired
    public ChannelFactory(ICopsChannel iCopsChannel, SMSChannel smsChannel, EPostChannel ePostChannel, EmailChannel emailChannel, RpadChannel rpadChannel) {
        this.iCopsChannel = iCopsChannel;
        this.smsChannel = smsChannel;
        this.ePostChannel = ePostChannel;
        this.emailChannel = emailChannel;
        this.rpadChannel = rpadChannel;
    }

    public ExternalChannel getDeliveryChannel(ChannelName channelName) {
        return switch (channelName) {
            case EPOST -> ePostChannel;
            case POLICE -> iCopsChannel;
            case SMS -> smsChannel;
            case EMAIL -> emailChannel;
            case RPAD -> rpadChannel;
            default ->
                    throw new CustomException("INVALID_DELIVERY_CHANNEL", "Delivery Channel provided is not Valid");
        };
    }
}
