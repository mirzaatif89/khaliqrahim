export async function installProcedures(db) {
  // Versioned name keeps startup repeatable without dropping routines in use.
  const [existing] = await db.execute('SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_NAME = ?', ['local_action_v2']);
  if (existing.length) return;
  await db.query(`CREATE PROCEDURE local_action_v2(IN action_name VARCHAR(50), IN a JSON)
  SQL SECURITY DEFINER
  BEGIN
    DECLARE cid CHAR(36); DECLARE oid CHAR(36); DECLARE pid CHAR(36);
    DECLARE pname TEXT; DECLARE phone_value VARCHAR(30); DECLARE number_value VARCHAR(40);
    DECLARE qty INT; DECLARE stock_value INT; DECLARE price_value INT; DECLARE subtotal_value INT DEFAULT 0;
    DECLARE fee_value INT DEFAULT 0; DECLARE free_value INT DEFAULT 0; DECLARE seq INT; DECLARE i INT DEFAULT 0;
    DECLARE items JSON; DECLARE settings JSON; DECLARE result JSON;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    SET phone_value = JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_phone'));
    IF action_name IN ('place_order','book_appointment','submit_lead') THEN
      IF CHAR_LENGTH(TRIM(JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_name')))) NOT BETWEEN 2 AND 100 OR phone_value NOT REGEXP '^03[0-9]{9}$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Enter a valid name and Pakistani mobile number';
      END IF;
      INSERT INTO customers(name,phone,email,visitor_ids) VALUES (TRIM(JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_name'))),phone_value,JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_email')),JSON_ARRAY(JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_visitor'))))
      ON DUPLICATE KEY UPDATE name=VALUES(name),email=VALUES(email),last_seen_at=CURRENT_TIMESTAMP,
      visitor_ids=IF(JSON_CONTAINS(visitor_ids,JSON_EXTRACT(a,'$.p_visitor')),visitor_ids,JSON_ARRAY_APPEND(visitor_ids,'$',JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_visitor'))));
      SELECT id INTO cid FROM customers WHERE phone=phone_value;
    END IF;
    IF action_name='place_order' THEN
      SET items=JSON_EXTRACT(a,'$.p_items');
      IF JSON_TYPE(items) <> 'ARRAY' OR JSON_LENGTH(items) NOT BETWEEN 1 AND 50 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Cart must contain 1 to 50 items'; END IF;
      IF JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_payment_method')) NOT IN ('cod','jazzcash','easypaisa','bank') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid payment method'; END IF;
      IF CHAR_LENGTH(JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_address'))) NOT BETWEEN 8 AND 500 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Enter your complete address'; END IF;
      UPDATE local_sequences SET value=value+1 WHERE name='order'; SELECT value INTO seq FROM local_sequences WHERE name='order';
      SET oid=UUID(); SET number_value=CONCAT('KR',seq);
      INSERT INTO orders(id,order_number,customer_id,customer_name,phone,email,address,city,notes,payment_method,payment_reference,visitor_id,subtotal,delivery_fee,total)
      VALUES(oid,number_value,cid,JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_name')),phone_value,JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_email')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_address')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_city')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_notes')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_payment_method')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_payment_reference')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_visitor')),0,0,0);
      WHILE i < JSON_LENGTH(items) DO
        SET pid=JSON_UNQUOTE(JSON_EXTRACT(items,CONCAT('$[',i,'].product_id')));
        SET qty=JSON_EXTRACT(items,CONCAT('$[',i,'].quantity'));
        IF qty IS NULL OR qty NOT BETWEEN 1 AND 100 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid quantity'; END IF;
        SET price_value=NULL;
        SELECT name,price,stock INTO pname,price_value,stock_value FROM products WHERE id=pid AND is_active=TRUE FOR UPDATE;
        IF price_value IS NULL OR stock_value < qty THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Product unavailable or insufficient stock'; END IF;
        UPDATE products SET stock=stock-qty WHERE id=pid;
        INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity,line_total) VALUES(oid,pid,pname,price_value,qty,price_value*qty);
        SET subtotal_value=subtotal_value+price_value*qty; SET i=i+1;
      END WHILE;
      SELECT value INTO settings FROM site_content WHERE \`key\`='store';
      SET fee_value=COALESCE(JSON_EXTRACT(settings,'$.delivery_fee'),0); SET free_value=COALESCE(JSON_EXTRACT(settings,'$.free_delivery_over'),0);
      IF subtotal_value<=0 OR (free_value>0 AND subtotal_value>=free_value) THEN SET fee_value=0; END IF;
      UPDATE orders SET subtotal=subtotal_value,delivery_fee=fee_value,total=subtotal_value+fee_value WHERE id=oid;
      SET result=JSON_OBJECT('order_number',number_value,'total',subtotal_value+fee_value,'subtotal',subtotal_value,'delivery_fee',fee_value,'phone',phone_value);
    ELSEIF action_name='book_appointment' THEN
      IF JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_type')) NOT IN ('in_clinic','online','follow_up') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid consultation type'; END IF;
      IF JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_date')) < DATE(UTC_TIMESTAMP()+INTERVAL 5 HOUR) OR JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_date')) > DATE(UTC_TIMESTAMP()+INTERVAL 5 HOUR)+INTERVAL 60 DAY OR DAYOFWEEK(JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_date')))=1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Choose Monday to Saturday within the next 60 days'; END IF;
      SELECT value INTO settings FROM site_content WHERE \`key\`='clinic';
      SET fee_value=CASE JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_type')) WHEN 'in_clinic' THEN COALESCE(JSON_EXTRACT(settings,'$.fees.consultation'),1000) WHEN 'follow_up' THEN COALESCE(JSON_EXTRACT(settings,'$.fees.follow_up'),500) ELSE NULL END;
      UPDATE local_sequences SET value=value+1 WHERE name='ticket'; SELECT value INTO seq FROM local_sequences WHERE name='ticket'; SET number_value=CONCAT('KRT-',seq);
      INSERT INTO appointments(ticket_number,customer_id,patient_name,phone,email,age,gender,consultation_type,preferred_date,preferred_time,complaint,fee,visitor_id)
      VALUES(number_value,cid,JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_name')),phone_value,JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_email')),NULLIF(JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_age')),'null'),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_gender')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_type')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_date')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_time')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_complaint')),fee_value,JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_visitor')));
      SET result=JSON_OBJECT('ticket_number',number_value,'fee',fee_value,'date',JSON_EXTRACT(a,'$.p_date'),'time',JSON_EXTRACT(a,'$.p_time'),'type',JSON_EXTRACT(a,'$.p_type'),'name',JSON_EXTRACT(a,'$.p_name'));
    ELSEIF action_name='submit_lead' THEN
      IF JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_source')) NOT IN ('product_inquiry','contact','callback') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid inquiry source'; END IF;
      INSERT INTO leads(customer_id,name,phone,email,product_id,source,message,visitor_id) VALUES(cid,JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_name')),phone_value,JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_email')),NULLIF(JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_product_id')),'null'),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_source')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_message')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_visitor')));
      SET result=JSON_EXTRACT('true','$');
    ELSEIF action_name='submit_review' THEN
      IF CHAR_LENGTH(TRIM(JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_name')))) NOT BETWEEN 2 AND 100 OR JSON_EXTRACT(a,'$.p_rating') NOT BETWEEN 1 AND 5 OR CHAR_LENGTH(TRIM(JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_comment')))) NOT BETWEEN 5 AND 2000 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Enter a name, rating and review'; END IF;
      INSERT INTO reviews(product_id,name,city,rating,comment) VALUES(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_product_id')),'null'),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_name')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_city')),JSON_EXTRACT(a,'$.p_rating'),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_comment'))); SET result=JSON_EXTRACT('true','$');
    ELSEIF action_name='track_product_event' THEN
      INSERT INTO product_events(visitor_id,product_id,event) VALUES(JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_visitor')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_product_id')),JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_event'))); SET result=JSON_EXTRACT('true','$');
    ELSEIF action_name='track_order' THEN
      SELECT JSON_OBJECT('order_number',order_number,'status',status,'payment_status',payment_status,'payment_method',payment_method,'customer_name',customer_name,'city',city,'subtotal',subtotal,'delivery_fee',delivery_fee,'total',total,'created_at',created_at,'items',COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('name',product_name,'quantity',quantity,'unit_price',unit_price,'line_total',line_total)) FROM order_items WHERE order_id=orders.id),JSON_ARRAY())) INTO result FROM orders WHERE order_number=UPPER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(a,'$.p_order_number')))) AND phone=phone_value;
    ELSE SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Unknown action';
    END IF;
    COMMIT;
    SELECT result AS result;
  END`);
}
